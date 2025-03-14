package org.egov.transformer.controller;


import jakarta.validation.Valid;
import org.egov.transformer.event.impl.OrderImpl;
import org.egov.transformer.models.OrderRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

// remove this whole class when migration is done
@RestController
public class ScriptController {

    private final OrderImpl order;

    @Autowired
    public ScriptController(OrderImpl order) {
        this.order = order;
    }


    @RequestMapping(value = "/v1/script", method = RequestMethod.POST)
    public ResponseEntity<?> hearingV1CreatePost(@Valid @RequestBody OrderRequest body) {
        try {
            order.process(body.getOrder(), body.getRequestInfo());
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }

    }
}
