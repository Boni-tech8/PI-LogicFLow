package com.logicflow.config;

import com.logicflow.common.Telefone;
import com.logicflow.user.Role;
import com.logicflow.user.User;
import com.logicflow.user.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

// O cadastro público não aceita ADMIN (RN08); ele nasce aqui, a partir do .env
@Component
public class AdminSeeder implements ApplicationRunner {

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final String telefone;
    private final String senha;

    public AdminSeeder(UserRepository users, PasswordEncoder encoder,
                       @Value("${app.admin.phone:}") String telefone,
                       @Value("${app.admin.password:}") String senha) {
        this.users = users;
        this.encoder = encoder;
        this.telefone = telefone;
        this.senha = senha;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (telefone.isBlank() || senha.isBlank()) return;
        String tel = Telefone.normalizar(telefone);
        if (users.existsByTelefone(tel)) return;
        users.save(new User("Administrador", tel, encoder.encode(senha), Role.ADMIN));
    }
}