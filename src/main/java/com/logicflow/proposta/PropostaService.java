package com.logicflow.proposta;

import com.logicflow.acordo.Acordo;
import com.logicflow.acordo.AcordoDtos.AcordoResponse;
import com.logicflow.acordo.AcordoRepository;
import com.logicflow.common.BusinessException;
import com.logicflow.demanda.Demanda;
import com.logicflow.demanda.DemandaRepository;
import com.logicflow.proposta.PropostaDtos.PropostaRequest;
import com.logicflow.proposta.PropostaDtos.PropostaResponse;
import com.logicflow.security.AuthUser;
import com.logicflow.user.Role;
import com.logicflow.user.UserRepository;
import java.time.LocalDate;
import java.util.List;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PropostaService {

    private static final String MSG_DUPLICADA = "Você já enviou uma proposta para esta demanda.";

    private final PropostaRepository propostas;
    private final DemandaRepository demandas;
    private final AcordoRepository acordos;
    private final UserRepository users;

    public PropostaService(PropostaRepository propostas, DemandaRepository demandas,
                           AcordoRepository acordos, UserRepository users) {
        this.propostas = propostas;
        this.demandas = demandas;
        this.acordos = acordos;
        this.users = users;
    }

    @Transactional
    public PropostaResponse enviar(AuthUser auth, Long demandaId, PropostaRequest r) {
        Demanda demanda = demandas.findById(demandaId)
                .orElseThrow(() -> BusinessException.naoEncontrado("Demanda não encontrada."));
        if (demanda.getStatus() != Demanda.Status.ABERTA) {
            throw BusinessException.conflito("Esta demanda não está aberta para propostas.");
        }
        if (propostas.existsByDemandaIdAndFaccaoId(demandaId, auth.id())) {
            throw BusinessException.conflito(MSG_DUPLICADA);
        }
        String mensagem = (r.mensagem() == null || r.mensagem().isBlank()) ? null : r.mensagem().trim();
        try {
            Proposta p = propostas.saveAndFlush(new Proposta(demanda, users.getReferenceById(auth.id()),
                    r.preco(), r.prazoDias(), mensagem));
            return PropostaResponse.de(p);
        } catch (DataIntegrityViolationException e) {
            throw BusinessException.conflito(MSG_DUPLICADA);
        }
    }

    // sort = price | deadline | recent; propostas retiradas não aparecem
    @Transactional(readOnly = true)
    public List<PropostaResponse> listarDaDemanda(AuthUser auth, Long demandaId, String sort) {
        Demanda demanda = demandas.findById(demandaId)
                .orElseThrow(() -> BusinessException.naoEncontrado("Demanda não encontrada."));
        if (auth.perfil() != Role.ADMIN && !demanda.getConfeccao().getId().equals(auth.id())) {
            throw BusinessException.proibido("Somente quem publicou a demanda vê as propostas.");
        }
        Sort ordem = switch (sort == null ? "recent" : sort) {
            case "price" -> Sort.by("preco").ascending();
            case "deadline" -> Sort.by("prazoDias").ascending();
            case "recent" -> Sort.by("criadoEm").descending();
            default -> throw BusinessException.invalido("sort deve ser: price, deadline ou recent.");
        };
        return propostas.findByDemandaIdAndStatusNot(demandaId, Proposta.Status.RETIRADA, ordem)
                .stream().map(PropostaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public List<PropostaResponse> minhas(AuthUser auth) {
        return propostas.findByFaccaoIdOrderByCriadoEmDesc(auth.id())
                .stream().map(PropostaResponse::de).toList();
    }

    @Transactional(readOnly = true)
    public PropostaResponse buscar(AuthUser auth, Long id) {
        Proposta p = carregar(id);
        boolean autora = p.getFaccao().getId().equals(auth.id());
        boolean dona = p.getDemanda().getConfeccao().getId().equals(auth.id());
        if (!autora && !dona && auth.perfil() != Role.ADMIN) {
            throw BusinessException.proibido("Você não tem acesso a esta proposta.");
        }
        return PropostaResponse.de(p);
    }

    // Aceitar cria o acordo e recusa as demais propostas da demanda
    @Transactional
    public AcordoResponse aceitar(AuthUser auth, Long propostaId) {
        Proposta proposta = carregar(propostaId);
        Demanda demanda = demandas.findByIdForUpdate(proposta.getDemanda().getId())
                .orElseThrow(() -> BusinessException.naoEncontrado("Demanda não encontrada."));

        if (!demanda.getConfeccao().getId().equals(auth.id())) {
            throw BusinessException.proibido("Somente quem publicou a demanda pode aceitar propostas.");
        }
        if (demanda.getStatus() != Demanda.Status.ABERTA) {
            throw BusinessException.conflito("Esta demanda não está mais aberta.");
        }
        if (proposta.getStatus() != Proposta.Status.ENVIADA) {
            throw BusinessException.conflito("Esta proposta não está disponível para aceite.");
        }

        proposta.setStatus(Proposta.Status.ACEITA);
        propostas.findByDemandaIdAndStatus(demanda.getId(), Proposta.Status.ENVIADA).stream()
                .filter(outra -> !outra.getId().equals(proposta.getId()))
                .forEach(outra -> outra.setStatus(Proposta.Status.RECUSADA));
        demanda.setStatus(Demanda.Status.EM_ACORDO);

        Acordo acordo = acordos.save(new Acordo(proposta, demanda, demanda.getConfeccao(), proposta.getFaccao(),
                proposta.getPreco(), proposta.getPrazoDias(),
                LocalDate.now().plusDays(proposta.getPrazoDias())));
        return AcordoResponse.resumo(acordo);
    }

    @Transactional
    public void retirar(AuthUser auth, Long id) {
        Proposta p = carregar(id);
        if (!p.getFaccao().getId().equals(auth.id())) {
            throw BusinessException.proibido("Somente a facção autora pode retirar a proposta.");
        }
        if (p.getStatus() != Proposta.Status.ENVIADA) {
            throw BusinessException.conflito("Só é possível retirar propostas com status ENVIADA.");
        }
        p.setStatus(Proposta.Status.RETIRADA);
    }

    private Proposta carregar(Long id) {
        return propostas.findById(id).orElseThrow(() -> BusinessException.naoEncontrado("Proposta não encontrada."));
    }
}