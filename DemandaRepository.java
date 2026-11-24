package com.logicflow.demanda;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface DemandaRepository extends JpaRepository<Demanda, Long> {

    Page<Demanda> findByStatusOrderByCriadoEmDesc(Demanda.Status status, Pageable pageable);

    Page<Demanda> findByConfeccaoIdOrderByCriadoEmDesc(Long confeccaoId, Pageable pageable);

    // Trava a linha para que duas propostas não sejam aceitas ao mesmo tempo
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select d from Demanda d where d.id = :id")
    Optional<Demanda> findByIdForUpdate(@Param("id") Long id);
}