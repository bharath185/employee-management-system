package com.ems.service;

import com.ems.exception.BadRequestException;
import com.ems.model.Holiday;
import com.ems.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HolidayService {

    private final HolidayRepository holidayRepository;

    public List<Holiday> getHolidays(Integer year) {
        if (year == null) year = LocalDate.now().getYear();
        return holidayRepository.findByYearOrderByDateAsc(year);
    }

    @Transactional
    public Holiday createHoliday(Holiday holiday) {
        if (holidayRepository.existsByDate(holiday.getDate())) {
            throw new BadRequestException("Holiday already exists on " + holiday.getDate());
        }
        holiday.setYear(holiday.getDate().getYear());
        return holidayRepository.save(holiday);
    }

    @Transactional
    public Holiday updateHoliday(Long id, Holiday updated) {
        Holiday holiday = holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found"));
        holiday.setName(updated.getName());
        holiday.setDate(updated.getDate());
        holiday.setYear(updated.getDate().getYear());
        holiday.setIsOptional(updated.getIsOptional());
        return holidayRepository.save(holiday);
    }

    @Transactional
    public void deleteHoliday(Long id) {
        holidayRepository.deleteById(id);
    }
}
