package com.ems.repository;

import com.ems.model.Employee;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

public class EmployeeSpecification {

    public static Specification<Employee> search(String keyword) {
        return (root, query, cb) -> {
            String pattern = "%" + keyword.toLowerCase() + "%";
            return cb.or(
                cb.like(cb.lower(root.get("employeeCode")), pattern),
                cb.like(cb.lower(root.get("firstName")), pattern),
                cb.like(cb.lower(root.get("surname")), pattern),
                cb.like(cb.lower(root.get("email")), pattern),
                cb.like(root.get("mobile"), pattern),
                cb.like(cb.lower(root.get("designation")), pattern),
                cb.like(cb.lower(root.get("aadharNumber")), pattern),
                cb.like(cb.lower(root.get("panNumber")), pattern),
                cb.like(cb.lower(root.get("customFields")), pattern)
            );
        };
    }

    public static Specification<Employee> hasEmployeeCode(String code) {
        return (root, query, cb) ->
            cb.like(cb.lower(root.get("employeeCode")),
                "%" + code.toLowerCase() + "%");
    }

    public static Specification<Employee> hasFirstName(String firstName) {
        return (root, query, cb) ->
            cb.like(cb.lower(root.get("firstName")),
                "%" + firstName.toLowerCase() + "%");
    }

    public static Specification<Employee> hasSurname(String surname) {
        return (root, query, cb) ->
            cb.like(cb.lower(root.get("surname")),
                "%" + surname.toLowerCase() + "%");
    }

    public static Specification<Employee> hasGender(String gender) {
        return (root, query, cb) -> cb.equal(root.get("gender"), gender);
    }

    public static Specification<Employee> hasEmployeeStatus(String status) {
        return (root, query, cb) -> cb.equal(root.get("employeeStatus"), status);
    }

    public static Specification<Employee> hasDesignation(String designation) {
        return (root, query, cb) ->
            cb.like(cb.lower(root.get("designation")),
                "%" + designation.toLowerCase() + "%");
    }

    public static Specification<Employee> hasDepartment(String department) {
        return (root, query, cb) ->
            cb.like(cb.lower(root.get("department")),
                "%" + department.toLowerCase() + "%");
    }

    public static Specification<Employee> hasReligion(String religion) {
        return (root, query, cb) -> cb.equal(root.get("religion"), religion);
    }

    public static Specification<Employee> hasSocialCategory(String category) {
        return (root, query, cb) -> cb.equal(root.get("socialCategory"), category);
    }

    public static Specification<Employee> hasSocialSubcategory(String subcategory) {
        return (root, query, cb) -> cb.equal(root.get("socialSubcategory"), subcategory);
    }

    public static Specification<Employee> hasProcessAssigned(String process) {
        return (root, query, cb) -> cb.equal(root.get("processAssigned"), process);
    }

    public static Specification<Employee> hasBloodGroup(String bloodGroup) {
        return (root, query, cb) -> cb.equal(root.get("bloodGroup"), bloodGroup);
    }

    public static Specification<Employee> hasHighestQualification(String qualification) {
        return (root, query, cb) -> cb.equal(root.get("highestQualification"), qualification);
    }

    public static Specification<Employee> hasMaritalStatus(String maritalStatus) {
        return (root, query, cb) -> cb.equal(root.get("maritalStatus"), maritalStatus);
    }

    public static Specification<Employee> hasAadhaarVerification(String status) {
        return (root, query, cb) -> cb.equal(root.get("aadhaarVerification"), status);
    }

    public static Specification<Employee> hasPanVerification(String status) {
        return (root, query, cb) -> cb.equal(root.get("panVerification"), status);
    }

    public static Specification<Employee> hasDojBetween(LocalDate from, LocalDate to) {
        return (root, query, cb) -> {
            if (from != null && to != null) {
                return cb.between(root.get("doj"), from, to);
            } else if (from != null) {
                return cb.greaterThanOrEqualTo(root.get("doj"), from);
            } else if (to != null) {
                return cb.lessThanOrEqualTo(root.get("doj"), to);
            }
            return cb.conjunction();
        };
    }

    public static Specification<Employee> hasDojYear(Integer year) {
        return (root, query, cb) -> {
            if (year == null) return cb.conjunction();
            LocalDate start = LocalDate.of(year, 1, 1);
            LocalDate end = LocalDate.of(year, 12, 31);
            return cb.between(root.get("doj"), start, end);
        };
    }

    public static Specification<Employee> hasDojMonth(Integer year, Integer month) {
        return (root, query, cb) -> {
            if (year == null || month == null) return cb.conjunction();
            LocalDate start = LocalDate.of(year, month, 1);
            LocalDate end = start.plusMonths(1).minusDays(1);
            return cb.between(root.get("doj"), start, end);
        };
    }
}
