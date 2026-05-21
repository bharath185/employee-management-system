package com.ems.repository;

import com.ems.model.Employee;
import jakarta.persistence.criteria.Predicate;
import org.springframework.data.jpa.domain.Specification;

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
                cb.like(cb.lower(root.get("designation")), pattern)
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

    public static Specification<Employee> hasReligion(String religion) {
        return (root, query, cb) -> cb.equal(root.get("religion"), religion);
    }

    public static Specification<Employee> hasSocialCategory(String category) {
        return (root, query, cb) -> cb.equal(root.get("socialCategory"), category);
    }

    public static Specification<Employee> withFilters(String search,
            String employeeCode, String firstName, String surname,
            String gender, String employeeStatus, String designation,
            String religion, String socialCategory) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (search != null && !search.isEmpty()) {
                String pattern = "%" + search.toLowerCase() + "%";
                predicates.add(cb.or(
                    cb.like(cb.lower(root.get("employeeCode")), pattern),
                    cb.like(cb.lower(root.get("firstName")), pattern),
                    cb.like(cb.lower(root.get("surname")), pattern),
                    cb.like(cb.lower(root.get("email")), pattern),
                    cb.like(root.get("mobile"), pattern)
                ));
            }
            if (employeeCode != null && !employeeCode.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("employeeCode")),
                    "%" + employeeCode.toLowerCase() + "%"));
            }
            if (firstName != null && !firstName.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("firstName")),
                    "%" + firstName.toLowerCase() + "%"));
            }
            if (surname != null && !surname.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("surname")),
                    "%" + surname.toLowerCase() + "%"));
            }
            if (gender != null && !gender.isEmpty()) {
                predicates.add(cb.equal(root.get("gender"), gender));
            }
            if (employeeStatus != null && !employeeStatus.isEmpty()) {
                predicates.add(cb.equal(root.get("employeeStatus"), employeeStatus));
            }
            if (designation != null && !designation.isEmpty()) {
                predicates.add(cb.like(cb.lower(root.get("designation")),
                    "%" + designation.toLowerCase() + "%"));
            }
            if (religion != null && !religion.isEmpty()) {
                predicates.add(cb.equal(root.get("religion"), religion));
            }
            if (socialCategory != null && !socialCategory.isEmpty()) {
                predicates.add(cb.equal(root.get("socialCategory"), socialCategory));
            }

            predicates.add(cb.equal(root.get("isDeleted"), false));

            return cb.and(predicates.toArray(new Predicate[0]));
        };
    }
}
