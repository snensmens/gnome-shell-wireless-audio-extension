import GLib from 'gi://GLib';
    
export function execute(command) {
    const result = GLib.spawn_command_line_sync(command);
    const decoder = new TextDecoder();
    
    return { 
        result: decoder.decode(result[1]),
        error: decoder.decode(result[2]),
        wasSuccessful: Object.keys(result[2]).length === 0
    }
}
