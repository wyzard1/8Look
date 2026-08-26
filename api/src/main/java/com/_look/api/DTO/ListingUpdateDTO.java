package com._look.api.DTO;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ListingUpdateDTO {
    private Integer listing_id;
    private Integer seller_id;
    private String title;
    private String description;
    private Double price;
    private String place;
    private List<String> image_urls;
}
