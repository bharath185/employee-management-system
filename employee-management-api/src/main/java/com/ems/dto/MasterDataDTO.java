package com.ems.dto;

import com.ems.model.MasterData;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MasterDataDTO {

    private Long id;

    @NotBlank(message = "Category is required")
    private String category;

    @NotBlank(message = "Code is required")
    private String code;

    @NotBlank(message = "Value is required")
    private String value;

    private Integer sortOrder;
    private Boolean active;

    public static MasterDataDTO fromEntity(MasterData entity) {
        return MasterDataDTO.builder()
            .id(entity.getId())
            .category(entity.getCategory())
            .code(entity.getCode())
            .value(entity.getValue())
            .sortOrder(entity.getSortOrder())
            .active(entity.getActive())
            .build();
    }

    public MasterData toEntity() {
        return MasterData.builder()
            .category(this.category)
            .code(this.code)
            .value(this.value)
            .sortOrder(this.sortOrder != null ? this.sortOrder : 0)
            .active(this.active != null ? this.active : true)
            .build();
    }
}
