package com.logicflow.acordo;

import com.logicflow.demanda.Demanda;
import com.logicflow.proposta.Proposta;
import com.logicflow.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "acordos")
public class Acordo {

    public enum Status { EM_EXECUCAO, ENTREGUE, FINALIZADO }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "proposta_id", nullable = false, unique = true)
    private Proposta proposta;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demanda_id", nullable = false)
    private Demanda demanda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confeccao_id", nullable = false)
    private User confeccao;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "faccao_id", nullable = false)
    private User faccao;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal preco;

    @Column(name = "prazo_dias", nullable = false)
    private int prazoDias;

    @Column(name = "data_limite", nullable = false)
    private LocalDate dataLimite;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.EM_EXECUCAO;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    protected Acordo() {}

public Acordo(Proposta proposta, Demanda demanda, User confeccao, User faccao,
              BigDecimal preco, int prazoDias, LocalDate dataLimite) {
    this.proposta = proposta;
    this.demanda = demanda;
    this.confeccao = confeccao;
    this.faccao = faccao;
    this.preco = preco;
    this.prazoDias = prazoDias;
    this.dataLimite = dataLimite;
}

    public Long getId() { return id; }
    public Proposta getProposta() { return proposta; }
    public Demanda getDemanda() { return demanda; }
    public User getConfeccao() { return confeccao; }
    public User getFaccao() { return faccao; }
    public BigDecimal getPreco() { return preco; }
    public int getPrazoDias() { return prazoDias; }
    public LocalDate getDataLimite() { return dataLimite; }
    public Status getStatus() { return status; }
    public Instant getCriadoEm() { return criadoEm; }

    public void setStatus(Status status) { this.status = status; }
}
