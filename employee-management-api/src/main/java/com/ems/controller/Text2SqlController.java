package com.ems.controller;

import com.ems.dto.APIResponse;
import com.ems.dto.Text2SqlRequest;
import com.ems.dto.Text2SqlResponse;
import com.ems.service.Text2SqlService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/text2sql")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class Text2SqlController {

    private final Text2SqlService text2SqlService;

    @PostMapping("/query")
    public ResponseEntity<APIResponse<Text2SqlResponse>> query(@RequestBody Text2SqlRequest request) {
        Text2SqlResponse result = text2SqlService.processQuestion(request.getQuestion());
        if (result.isSuccess()) {
            return ResponseEntity.ok(APIResponse.success(result));
        }
        return ResponseEntity.badRequest().body(APIResponse.error(result.getErrorMessage(), result));
    }
}
