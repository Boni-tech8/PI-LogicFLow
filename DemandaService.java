package com.logicflow.demanda;

import com.logicflow.common.BusinessException;
import com.logicflow.demanda.DemandaDtos.DemandaRequest;
import com.logicflow.demanda.DemandaDtos.DemandaResponse;
import com.logicflow.security.AuthUser;
import com.logicflow.user.UserRepository;
import java.util.List;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DemandaService {

    private final DemandaRepository demandas;
    private final UserRepository users;

    public DemandaService(DemandaRepository demandas, UserRepository users) {
        this.demandas = demandas;
        this.users = users;
    }

    @Transactional
    public DemandaResponse publicar(AuthUser auth, DemandaRequest r) {
        String descricao = (r.descricao() == null || r.descricao().isBlank()) ? null : r.descricao().trim();
        Demanda d = new Demanda(users.getReferenceById(auth.id()), r.servico().trim(), r.quantidade(),
                r.prazo(), r.local().trim(), descricao);
        return DemandaResponse.de(demandas.save(d));
    }

    @Transactional(readOnly = true)
    public List<DemandaResponse> listarAbertas(int page, int size) {
        return demandas.findByStatusOrderByCriadoEmDesc(Demanda.Status.ABERTA, pagina(page, size))
                .map(DemandaResponse::de).getContent();
    }

    @Transactional(readOnly = true)
    public List<DemandaResponse> minhas(AuthUser auth, int page, int size) {
        return demandas.findByConfeccaoIdOrderByCriadoEmDesc(auth.id(), pagina(page, size))
                .map(DemandaResponse::de).getContent();
    }

    @Transactional(readOnly = true)
    public DemandaResponse buscar(Long id) {
        return demandas.findById(id).map(DemandaResponse::de)
                .orElseThrow(() -> BusinessException.naoEncontrado("Demanda não encontrada."));
    }

    private Pageable pagina(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50));
    }
}