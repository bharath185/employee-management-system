package com.ems.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;

@Slf4j
@Service
@RequiredArgsConstructor
public class ScheduledTaskService {

    private final LeaveExcelService leaveExcelService;

    @Scheduled(cron = "0 0 6 1 * ?")
    public void creditMonthlyLeave() {
        LocalDate today = LocalDate.now();
        log.info("Running scheduled monthly leave credit for {}/{}", today.getMonthValue(), today.getYear());
        try {
            leaveExcelService.creditMonthlyLeave(today.getMonthValue(), today.getYear());
            log.info("Scheduled monthly leave credit completed for {}/{}", today.getMonthValue(), today.getYear());
        } catch (Exception e) {
            log.error("Scheduled monthly leave credit failed: {}", e.getMessage());
        }
    }
}
