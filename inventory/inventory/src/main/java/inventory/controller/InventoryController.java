package inventory.controller;

import inventory.service.InventoryService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    @GetMapping("/check")
    public boolean checkStock(
            @RequestParam Long productCode,
            @RequestParam int quantity) {

        return inventoryService.checkStock(productCode, quantity);
    }

    @PostMapping("/reduce")
    public String reduceStock(
            @RequestParam Long productCode,
            @RequestParam int quantity) {

        inventoryService.reduceStock(productCode, quantity);

        return "Stock updated";
    }
}