package com.lms.controller.admin;

import com.lms.dto.config.BankInfoResponse;
import com.lms.dto.config.ConfigResponse;
import com.lms.dto.config.UpdateBankInfoRequest;
import com.lms.dto.config.UpdateConfigRequest;
import com.lms.entity.BankInfo;
import com.lms.entity.SystemConfig;
import com.lms.entity.User;
import com.lms.exception.ResourceNotFoundException;
import com.lms.repository.BankInfoRepository;
import com.lms.service.SystemConfigService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/config")
@RequiredArgsConstructor
public class ConfigController {

    private final SystemConfigService systemConfigService;
    private final BankInfoRepository  bankInfoRepository;

    /** ADMIN: list all config keys */
    @GetMapping
    public ResponseEntity<List<ConfigResponse>> listAll() {
        List<ConfigResponse> configs = systemConfigService.findAll()
                .stream()
                .map(ConfigResponse::fromEntity)
                .toList();
        return ResponseEntity.ok(configs);
    }

    /** ADMIN: update a single config key's value */
    @PatchMapping
    public ResponseEntity<ConfigResponse> update(
            @Valid @RequestBody UpdateConfigRequest req,
            Authentication authentication
    ) {
        User admin = requireUser(authentication);
        SystemConfig updated = systemConfigService.updateValue(req.getKey(), req.getValue(), admin);
        return ResponseEntity.ok(ConfigResponse.fromEntity(updated));
    }

    /** Public (bank info is shown on payment page) — no auth required */
    @GetMapping("/bank-info")
    public ResponseEntity<BankInfoResponse> getBankInfo() {
        BankInfo bank = bankInfoRepository.findById(1)
                .orElseThrow(() -> new ResourceNotFoundException("Bank info not configured"));
        return ResponseEntity.ok(BankInfoResponse.fromEntity(bank));
    }

    /** ADMIN: update bank info */
    @PutMapping("/bank-info")
    public ResponseEntity<BankInfoResponse> updateBankInfo(
            @Valid @RequestBody UpdateBankInfoRequest req,
            Authentication authentication
    ) {
        requireUser(authentication);
        BankInfo bank = bankInfoRepository.findById(1)
                .orElseGet(() -> BankInfo.builder().build());

        bank.setBankName(req.getBankName());
        bank.setAccountNumber(req.getAccountNumber());
        bank.setAccountName(req.getAccountName());
        bank.setBranch(req.getBranch());
        bank.setTransferTemplate(req.getTransferTemplate());
        bank.setQrImageUrl(req.getQrImageUrl());

        BankInfo saved = bankInfoRepository.save(bank);
        return ResponseEntity.ok(BankInfoResponse.fromEntity(saved));
    }

    // ──────────────────────────────────────────────────────────────
    private User requireUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User u) return u;
        throw new SecurityException("Unauthorized");
    }
}
