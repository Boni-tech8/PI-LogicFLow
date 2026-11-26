package com.logicflow.demanda;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.time.LocalDate;

public final class DemandaDtos {

    private DemandaDtos() {}

    public record DemandaRequest(
            @NotBlank(message = "Serviço é obrigatório.")
            @Size(max = 120, message = "Serviço deve ter no máximo 120 caracteres.")
            String servico,

            @NotNull(message = "Quantidade é obrigatória.")
            @Min(value = 1, message = "Quantidade deve ser maior que zero.")
            Integer quantidade,

            @NotNull(message = "Prazo é obrigatório.")
            @Future(message = "Prazo deve ser uma data futura.")
            LocalDate prazo,

            @NotBlank(message = "Local é obrigatório.")
            @Size(max = 120, message = "Local deve ter no máximo 120 caracteres.")
            String local,

            @Size(max = 1000, message = "Descrição deve ter no máximo 1000 caracteres.")
            String descricao) {}

    // Sem telefone: contato só é liberado dentro de um acordo
    public record DemandaResponse(Long id, String servico, int quantidade, LocalDate prazo, String local,
                                  String descricao, Demanda.Status status, Long confeccaoId,
                                  String confeccaoNome, Instant criadoEm) {
        public static DemandaResponse de(Demanda d) {
            return new DemandaResponse(d.getId(), d.getServico(), d.getQuantidade(), d.getPrazo(), d.getLocal(),
                    d.getDescricao(), d.getStatus(), d.getConfeccao().getId(), d.getConfeccao().getNome(),
                    d.getCriadoEm());
        }
    }
}