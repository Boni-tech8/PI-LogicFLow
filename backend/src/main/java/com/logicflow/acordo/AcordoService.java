package com.logicflow.acordo;

import com.logicflow.acordo.AcordoDtos.AcordoResponse;
import com.logicflow.acordo.AcordoDtos.Contato;
import com.logicflow.acordo.AcordoDtos.DetalheResponse;
import com.logicflow.user.User;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AcordoService {

    private final AcordoRepository acordoRepository;

    public AcordoService(AcordoRepository acordoRepository) {
        this.acordoRepository = acordoRepository;
    }

    @Transactional(readOnly = true)
    public DetalheResponse detalhar(Long id, User usuario) {
        Acordo acordo = buscar(id);
        boolean admin = ehAdmin(usuario);
        boolean confeccao = ehConfeccao(acordo, usuario);
        boolean faccao = ehFaccao(acordo, usuario);

        if (!admin && !confeccao && !faccao) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Você não participa deste acordo.");
        }

        // Cada parte vê só o contato da contraparte; ADMIN vê os dois
        Contato contatoConfeccao = (admin || faccao) ? contato(acordo.getConfeccao(), acordo) : null;
        Contato contatoFaccao = (admin || confeccao) ? contato(acordo.getFaccao(), acordo) : null;

        return new DetalheResponse(AcordoResponse.resumo(acordo), contatoConfeccao, contatoFaccao);
    }

    @Transactional(readOnly = true)
    public List<AcordoResponse> listarMeus(User usuario) {
        return acordoRepository
                .findByConfeccaoIdOrFaccaoIdOrderByCriadoEmDesc(usuario.getId(), usuario.getId())
                .stream()
                .map(AcordoResponse::resumo)
                .toList();
    }

    @Transactional
    public AcordoResponse atualizarStatus(Long id, Acordo.Status novo, User usuario) {
        Acordo acordo = buscar(id);
        Acordo.Status atual = acordo.getStatus();

        if (novo == Acordo.Status.ENTREGUE && atual == Acordo.Status.EM_EXECUCAO) {
            exigir(ehFaccao(acordo, usuario), "Só a facção contratada pode marcar como entregue.");
        } else if (novo == Acordo.Status.FINALIZADO && atual == Acordo.Status.ENTREGUE) {
            exigir(ehConfeccao(acordo, usuario), "Só a confecção contratante pode finalizar o acordo.");
        } else {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Transição inválida: " + atual + " -> " + novo + ".");
        }

        acordo.setStatus(novo);
        return AcordoResponse.resumo(acordoRepository.save(acordo));
    }

    private Acordo buscar(Long id) {
        return acordoRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Acordo não encontrado."));
    }

    private Contato contato(User user, Acordo acordo) {
        return new Contato(user.getTelefone(), WhatsAppLink.gerar(user.getTelefone(), acordo));
    }

    private boolean ehConfeccao(Acordo acordo, User usuario) {
        return acordo.getConfeccao().getId().equals(usuario.getId());
    }

    private boolean ehFaccao(Acordo acordo, User usuario) {
        return acordo.getFaccao().getId().equals(usuario.getId());
    }

    private boolean ehAdmin(User usuario) {
        return "ADMIN".equals(usuario.getPerfil().name());
    }

    private void exigir(boolean permitido, String mensagem) {
        if (!permitido) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, mensagem);
        }
    }
}