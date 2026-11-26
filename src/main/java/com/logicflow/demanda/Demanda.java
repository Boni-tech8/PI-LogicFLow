package com.logicflow.demanda;

import com.logicflow.user.User;
import jakarta.persistence.*;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "demandas")
public class Demanda {

    public enum Status { ABERTA, EM_ACORDO, CONCLUIDA, CANCELADA }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "confeccao_id", nullable = false)
    private User confeccao;

    @Column(nullable = false, length = 120)
    private String servico;

    @Column(nullable = false)
    private int quantidade;

    @Column(nullable = false)
    private LocalDate prazo;

    @Column(name = "local_execucao", nullable = false, length = 120)
    private String local;

    @Column(length = 1000)
    private String descricao;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.ABERTA;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    protected Demanda() {}

    public Demanda(User confeccao, String servico, int quantidade, LocalDate prazo, String local, String descricao) {
        this.confeccao = confeccao;
        this.servico = servico;
        this.quantidade = quantidade;
        this.prazo = prazo;
        this.local = local;
        this.descricao = descricao;
    }

    public Long getId() { return id; }
    public User getConfeccao() { return confeccao; }
    public String getServico() { return servico; }
    public int getQuantidade() { return quantidade; }
    public LocalDate getPrazo() { return prazo; }
    public String getLocal() { return local; }
    public String getDescricao() { return descricao; }
    public Status getStatus() { return status; }
    public void setStatus(Status status) { this.status = status; }
    public Instant getCriadoEm() { return criadoEm; }
}