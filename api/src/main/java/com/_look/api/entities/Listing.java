package com._look.api.entities;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "listings")
public class Listing {
	
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
	private Integer listing_id;
    private Integer seller_id;
    private Integer category_id;
    @Column(nullable = false)
    private String title;
    private String description;
    private Double price;
    private String place;
    private Integer view_count;
    @Setter
    private Instant createdAt;
    @Setter
    private Instant updatedAt;

    public Listing() {
    }

    public Listing(Integer listing_id, Integer seller_id, Integer category_id, String title, String description, Double price, String place, Integer view_count, Instant createdAt, Instant updatedAt, List<String> image_urls) {
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


    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "image_urls", columnDefinition = "varchar[]")
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

    public void setTitle(String title) {
        this.title = title;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public void setPlace(String place) {
        this.place = place;
    }

    public void setSellerId(Integer seller_id) {
        this.seller_id = seller_id;
    }

    public void setCategoryId(Integer category_id) {
        this.category_id = category_id;
    }

}
