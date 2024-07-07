import {execute} from './command.js';

export class PactlController {
    
    // check if pactl package is installed on the system
    isInstalled() {
        const checkPactlVersionQuery = execute("pactl --version");
        
        return checkPactlVersionQuery.wasSuccessful;
    }
    
}