import { describe, it } from 'mocha';
import { expect } from 'chai';
import explodeCrate from '../lib/explodeCrate.js';
import { ROCrate } from 'ro-crate';
import { readFileSync } from 'fs';
describe('explodeCrate', function() {
    it('should explode crate correctly', function() {
        // TODO: Add test implementation
        const crate = new ROCrate({array: true, link: true});
        var entities = explodeCrate(crate);
        expect(entities).to.be.an('array');
        expect(entities.length).to.be.equal(0); // None of the default types match
        // Additional checks can be added here based on the expected structure of the crate 
        
        crate.root["@type"].push("RepositoryCollection"); // Add a type to match the default types

        entities = explodeCrate(crate);
        expect(entities).to.be.an('array');
        expect(entities.length).to.be.equal(1);
        
    });
    it('should explode the test collection correctly', function() {
        // TODO: Add test implementation
        const path = 'test_data/UDHR-Translations-w-SubCollections/ro-crate-metadata.json';
        const data = readFileSync(path, 'utf8');
        const crate = new ROCrate(JSON.parse(data),{array: true, link: true});
        var entities = explodeCrate(crate);
   
        expect(entities).to.be.an('array');
        // Additional checks can be added here based on the expected structure of the crate 
        
      
        
        expect(entities.length).to.be.equal(42);
        
    });

});
