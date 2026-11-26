package com.logicflow.acordo;

import com.logicflow.acordo.AcordoDtos.AcordoResponse;
import com.logicflow.acordo.AcordoDtos.DetalheResponse;
import com.logicflow.acordo.AcordoDtos.StatusRequest;
import com.logicflow.user.User;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/acordos")
public class AcordoController {

    private final AcordoService acordoService;

    public AcordoController(AcordoService acordoService) {
        this.acordoService = acordoService;
    }

    @GetMapping("/meus")
    public List<AcordoResponse> meus(@AuthenticationPrincipal User usuario) {
        return acordoService.listarMeus(usuario);
    }

    @GetMapping("/{id}")
    public DetalheResponse detalhar(@PathVariable Long id, @AuthenticationPrincipal User usuario) {
        return acordoService.detalhar(id, usuario);
    }

    @PatchMapping("/{id}/status")
    public AcordoResponse atualizarStatus(@PathVariable Long id,
                                          @Valid @RequestBody StatusRequest request,
                                          @AuthenticationPrincipal User usuario) {
        return acordoService.atualizarStatus(id, request.status(), usuario);
    }
}