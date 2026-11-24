package com.logicflow.acordo;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AcordoRepository extends JpaRepository<Acordo, Long> {

    boolean existsByPropostaId(Long propostaId);

    List<Acordo> findByConfeccaoIdOrFaccaoIdOrderByCriadoEmDesc(Long confeccaoId, Long faccaoId);
}