package com.logicflow.proposta;

import com.logicflow.acordo.AcordoDtos.AcordoResponse;
import com.logicflow.proposta.PropostaDtos.PropostaRequest;
import com.logicflow.proposta.PropostaDtos.PropostaResponse;
import com.logicflow.security.AuthUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
public class PropostaController {

    private final PropostaService service;

    public PropostaController(PropostaService service) {
        this.service = service;
    }

    @PostMapping("/api/demandas/{demandaId}/propostas")
    @PreAuthorize("hasRole('FACCAO')")
    public ResponseEntity<PropostaResponse> enviar(@AuthenticationPrincipal AuthUser user,
                                                @PathVariable Long demandaId,
                                                @Valid @RequestBody PropostaRequest body) {
        PropostaResponse criada = service.enviar(user, demandaId, body);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/propostas/{id}").buildAndExpand(criada.id()).toUri();
        return ResponseEntity.created(location).body(criada);
    }

    @GetMapping("/api/demandas/{demandaId}/propostas")
    @PreAuthorize("hasAnyRole('CONFECCAO','ADMIN')")
    public List<PropostaResponse> listarDaDemanda(@AuthenticationPrincipal AuthUser user,
                                                @PathVariable Long demandaId,
                                                @RequestParam(required = false) String sort) {
        return service.listarDaDemanda(user, demandaId, sort);
    }

    @GetMapping("/api/propostas/minhas")
    @PreAuthorize("hasRole('FACCAO')")
    public List<PropostaResponse> minhas(@AuthenticationPrincipal AuthUser user) {
        return service.minhas(user);
    }

    @GetMapping("/api/propostas/{id}")
    public PropostaResponse buscar(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        return service.buscar(user, id);
    }

    @PostMapping("/api/propostas/{id}/aceitar")
    @PreAuthorize("hasRole('CONFECCAO')")
    public ResponseEntity<AcordoResponse> aceitar(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        AcordoResponse acordo = service.aceitar(user, id);
        URI location = ServletUriComponentsBuilder.fromCurrentContextPath()
                .path("/api/acordos/{id}").buildAndExpand(acordo.id()).toUri();
        return ResponseEntity.created(location).body(acordo);
    }

    @DeleteMapping("/api/propostas/{id}")
    @PreAuthorize("hasRole('FACCAO')")
    public ResponseEntity<Void> retirar(@AuthenticationPrincipal AuthUser user, @PathVariable Long id) {
        service.retirar(user, id);
        return ResponseEntity.noContent().build();
    }
}