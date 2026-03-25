package inventory.controller;

import inventory.model.Product;
import inventory.service.InventoryService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/products")
public class ProductController {

    private final InventoryService inventoryService;

    public ProductController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    // Accessible to all logged in users
    @GetMapping
    public List<Product> getAllProducts() {
        return inventoryService.getAllProducts();
    }
}
