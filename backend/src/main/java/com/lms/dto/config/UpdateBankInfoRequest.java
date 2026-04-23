package com.lms.dto.config;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class UpdateBankInfoRequest {

    @NotBlank
    @Size(max = 255)
    private String bankName;

    @NotBlank
    @Size(max = 50)
    private String accountNumber;

    @NotBlank
    @Size(max = 255)
    private String accountName;

    @Size(max = 255)
    private String branch;

    private String transferTemplate;

    @Size(max = 2000)
    private String qrImageUrl;
}
