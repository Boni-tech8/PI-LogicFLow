package com.logicflow.acordo;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

public final class AcordoDtos {

    private AcordoDtos() {}

    public record AcordoResponse(
            Long id,
            Long propostaId,
            Long demandaId,
            Long confeccaoId,
            Long faccaoId,
            BigDecimal preco,
            int prazoDias,
            LocalDate dataLimite,
            Acordo.Status status,
            Instant criadoEm
    ) {
        public static AcordoResponse resumo(Acordo a) {
            return new AcordoResponse(
                    a.getId(),
                    a.getProposta().getId(),
                    a.getDemanda().getId(),
                    a.getConfeccao().getId(),
                    a.getFaccao().getId(),
                    a.getPreco(),
                    a.getPrazoDias(),
                    a.getDataLimite(),
                    a.getStatus(),
                    a.getCriadoEm()
            );
        }
    }

    public record Contato(String telefone, String whatsappLink) {}

    // Cada campo de contato fica null quando o usuário não tem direito de vê-lo
    public record DetalheResponse(
            AcordoResponse acordo,
            Contato contatoConfeccao,
            Contato contatoFaccao
    ) {}

    public record StatusRequest(@NotNull Acordo.Status status) {}
}