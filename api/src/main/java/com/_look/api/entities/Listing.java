package com._look.api.entities;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listings")
public class Listing {
	
    @Id
	private Integer listing_id;
    private Integer seller_id;
    private Integer category_id;
    @Column(nullable = false)
    private String title;
    private String description;
    private Double price;
    private String place;
    private Integer view_count;
    private Instant createdAt;
    private Instant updatedAt;

    public Listing(Integer listing_id,Integer seller_id, Integer category_id, String title, String description, Double price, String place, Integer view_count, Instant createdAt, Instant updatedAt, List<String> image_urls) {
        this.listing_id = listing_id;
        this.seller_id = seller_id;
        this.category_id = category_id;
        this.title = title;
        this.description = description;
        this.price = price;
        this.image_urls = image_urls;
        this.place = place;
        this.view_count = view_count;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt ;
    }


    @ElementCollection
    private List<String> image_urls = new ArrayList<>();
    
    

	public Integer getId() {
		return listing_id;
	}

    public Integer getSellerId() {
        return seller_id;
    }

    public Integer getCategoryId() {
        return category_id;
    }

    public String getTitle() {
        return title;
    }

    public String getDescription() {
        return description;
    }

    public Double getPrice() {
        return price;
    }

    public String getPlace() {
        return place;
    }

    public Integer getViewCount() {
        return view_count;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public List<String> getImages() {
        return image_urls;
    }
}
