package com.logicflow.proposta;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.Instant;

public final class PropostaDtos {

    private PropostaDtos() {}

    public record PropostaRequest(
            @NotNull(message = "Preço é obrigatório.")
            @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero.")
            BigDecimal preco,

            @NotNull(message = "Prazo em dias é obrigatório.")
            @Min(value = 1, message = "Prazo deve ser de pelo menos 1 dia.")
            Integer prazoDias,

            @Size(max = 500, message = "Mensagem deve ter no máximo 500 caracteres.")
            String mensagem) {}

    public record PropostaResponse(Long id, Long demandaId, Long faccaoId, String faccaoNome,
                                   BigDecimal preco, int prazoDias, String mensagem,
                                   Proposta.Status status, Instant criadoEm) {
        public static PropostaResponse de(Proposta p) {
            return new PropostaResponse(p.getId(), p.getDemanda().getId(), p.getFaccao().getId(),
                    p.getFaccao().getNome(), p.getPreco(), p.getPrazoDias(), p.getMensagem(),
                    p.getStatus(), p.getCriadoEm());
        }
    }
}