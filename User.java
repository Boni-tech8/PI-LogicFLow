package com.logicflow.user;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, unique = true, length = 20)
    private String telefone;

    @Column(name = "senha_hash", nullable = false)
    private String senhaHash;

    // O perfil não muda depois do cadastro
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, updatable = false, length = 20)
    private Role perfil;

    @Column(name = "lgpd_consentimento_em", nullable = false, updatable = false)
    private Instant lgpdConsentimentoEm = Instant.now();

    @Column(nullable = false)
    private boolean suspenso = false;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private Instant criadoEm = Instant.now();

    protected User() {}

    public User(String nome, String telefone, String senhaHash, Role perfil) {
        this.nome = nome;
        this.telefone = telefone;
        this.senhaHash = senhaHash;
        this.perfil = perfil;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public String getTelefone() { return telefone; }
    public String getSenhaHash() { return senhaHash; }
    public Role getPerfil() { return perfil; }
    public boolean isSuspenso() { return suspenso; }
    public void setSuspenso(boolean suspenso) { this.suspenso = suspenso; }
}