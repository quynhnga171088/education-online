package com.lms.dto.config;

import com.lms.entity.BankInfo;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankInfoResponse {
    private Integer id;
    private String bankName;
    private String accountNumber;
    private String accountName;
    private String branch;
    private String transferTemplate;
    private String qrImageUrl;
    private LocalDateTime updatedAt;

    public static BankInfoResponse fromEntity(BankInfo b) {
        return BankInfoResponse.builder()
                .id(b.getId())
                .bankName(b.getBankName())
                .accountNumber(b.getAccountNumber())
                .accountName(b.getAccountName())
                .branch(b.getBranch())
                .transferTemplate(b.getTransferTemplate())
                .qrImageUrl(b.getQrImageUrl())
                .updatedAt(b.getUpdatedAt())
                .build();
    }
}
