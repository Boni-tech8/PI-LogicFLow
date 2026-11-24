package com.logicflow.security;

import com.logicflow.user.Role;

public record AuthUser(Long id, Role perfil, String nome) {}