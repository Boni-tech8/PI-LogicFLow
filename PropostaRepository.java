package com.logicflow.proposta;

import java.util.List;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PropostaRepository extends JpaRepository<Proposta, Long> {

    boolean existsByDemandaIdAndFaccaoId(Long demandaId, Long faccaoId);

    List<Proposta> findByDemandaIdAndStatusNot(Long demandaId, Proposta.Status status, Sort sort);

    List<Proposta> findByDemandaIdAndStatus(Long demandaId, Proposta.Status status);

    List<Proposta> findByFaccaoIdOrderByCriadoEmDesc(Long faccaoId);
}