package com.ems.service;

import com.ems.model.AttendanceRecord;
import com.ems.model.Employee;
import com.ems.model.Holiday;
import com.ems.repository.AttendanceRepository;
import com.ems.repository.EmployeeRepository;
import com.ems.repository.HolidayRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HolidayService {

    private final HolidayRepository holidayRepository;
    private final EmployeeRepository employeeRepository;
    private final AttendanceRepository attendanceRepository;

    public List<Holiday> getHolidays(Integer year) {
        if (year == null) year = LocalDate.now().getYear();
        return holidayRepository.findByYearOrderByDateAsc(year);
    }

    @Transactional
    public Holiday createHoliday(Holiday holiday) {
        holiday.setYear(holiday.getDate().getYear());
        boolean specific = Boolean.TRUE.equals(holiday.getIsProcessSpecific()) || Boolean.TRUE.equals(holiday.getIsDepartmentSpecific());
        String procs = holiday.getProcesses() != null ? holiday.getProcesses() : holiday.getDepartments();
        holiday.setIsProcessSpecific(specific);
        holiday.setProcesses(procs);
        holiday.setIsDepartmentSpecific(specific);
        holiday.setDepartments(procs);
        Holiday saved = holidayRepository.save(holiday);
        syncAttendanceForHolidayDate(saved.getDate());
        return saved;
    }

    @Transactional
    public Holiday updateHoliday(Long id, Holiday updated) {
        Holiday holiday = holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found"));
        LocalDate oldDate = holiday.getDate();

        holiday.setName(updated.getName());
        holiday.setDate(updated.getDate());
        holiday.setYear(updated.getDate().getYear());
        holiday.setIsOptional(updated.getIsOptional());
        boolean specific = Boolean.TRUE.equals(updated.getIsProcessSpecific()) || Boolean.TRUE.equals(updated.getIsDepartmentSpecific());
        String procs = updated.getProcesses() != null ? updated.getProcesses() : updated.getDepartments();
        holiday.setIsProcessSpecific(specific);
        holiday.setProcesses(procs);
        holiday.setIsDepartmentSpecific(specific);
        holiday.setDepartments(procs);
        Holiday saved = holidayRepository.save(holiday);

        if (!oldDate.equals(saved.getDate())) {
            syncAttendanceForHolidayDate(oldDate);
        }
        syncAttendanceForHolidayDate(saved.getDate());
        return saved;
    }

    @Transactional
    public void deleteHoliday(Long id) {
        Holiday holiday = holidayRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Holiday not found"));
        LocalDate date = holiday.getDate();
        holidayRepository.deleteById(id);
        syncAttendanceForHolidayDate(date);
    }

    @Transactional
    public void syncAttendanceForHolidayDate(LocalDate date) {
        if (date == null) return;
        List<Holiday> activeHolidays = holidayRepository.findAllByDate(date);
        List<Employee> liveEmployees = employeeRepository.findAllLiveEmployees();
        for (Employee emp : liveEmployees) {
            boolean isHoliday = activeHolidays.stream().anyMatch(h -> h.appliesToProcess(emp.getProcessAssigned()));
            attendanceRepository.findByEmployeeIdAndAttendanceDate(emp.getId(), date).ifPresent(record -> {
                if (!Boolean.TRUE.equals(record.getLocked())) {
                    if (isHoliday && "P".equalsIgnoreCase(record.getStatus())) {
                        record.setStatus("H");
                        attendanceRepository.save(record);
                    } else if (!isHoliday && "H".equalsIgnoreCase(record.getStatus())) {
                        record.setStatus("P");
                        attendanceRepository.save(record);
                    }
                }
            });
        }
    }
}
