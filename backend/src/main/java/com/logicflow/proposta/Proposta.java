package com.logicflow.proposta;

import com.logicflow.demanda.Demanda;
import com.logicflow.user.User;
import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "propostas",
        uniqueConstraints = @UniqueConstraint(columnNames = {"demanda_id", "faccao_id"}))
public class Proposta {

    public enum Status { ENVIADA, ACEITA, RECUSADA, RETIRADA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "demanda_id", nullable = false)
    private Demanda demanda;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "faccao_id", nullable = false)
    private User faccao;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal preco;

    @Column(name = "prazo_dias", nullable = false)
    private int prazoDias;

    @Column(length = 500)
    private String mensagem;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ENVIADA;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    protected Proposta() {}

    public Proposta(Demanda demanda, User faccao, BigDecimal preco, int prazoDias, String mensagem) {
        this.demanda = demanda;
        this.faccao = faccao;
        this.preco = preco;
        this.prazoDias = prazoDias;
        this.mensagem = mensagem;
    }

    public Long getId() { return id; }
    public Demanda getDemanda() { return demanda; }
    public User getFaccao() { return faccao; }
    public BigDecimal getPreco() { return preco; }
    public int getPrazoDias() { return prazoDias; }
    public String getMensagem() { return mensagem; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getCriadoEm() { return criadoEm; }
}