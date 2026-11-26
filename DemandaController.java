package com.logicflow.demanda;

import com.logicflow.demanda.DemandaDtos.DemandaRequest;
import com.logicflow.demanda.DemandaDtos.DemandaResponse;
import com.logicflow.security.AuthUser;
import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

@RestController
@RequestMapping("/api/demandas")
public class DemandaController {

    private final DemandaService service;

    public DemandaController(DemandaService service) {
        this.service = service;
    }

    @PostMapping
    @PreAuthorize("hasRole('CONFECCAO')")
    public ResponseEntity<DemandaResponse> criar(@AuthenticationPrincipal AuthUser user,
                                                 @Valid @RequestBody DemandaRequest body) {
        DemandaResponse criada = service.publicar(user, body);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}").buildAndExpand(criada.id()).toUri();
        return ResponseEntity.created(location).body(criada);
    }

    @GetMapping
    public List<DemandaResponse> listarAbertas(@RequestParam(defaultValue = "0") int page,
                                               @RequestParam(defaultValue = "20") int size) {
        return service.listarAbertas(page, size);
    }

    @GetMapping("/minhas")
    @PreAuthorize("hasRole('CONFECCAO')")
    public List<DemandaResponse> minhas(@AuthenticationPrincipal AuthUser user,
                                        @RequestParam(defaultValue = "0") int page,
                                        @RequestParam(defaultValue = "20") int size) {
        return service.minhas(user, page, size);
    }

    @GetMapping("/{id}")
    public DemandaResponse buscar(@PathVariable Long id) {
        return service.buscar(id);
    }
}