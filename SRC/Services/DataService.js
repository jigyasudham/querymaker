export const DataService = {
    parseCSV(csvText) { 
        const lines = csvText.trim().split(/\r?\n/); 
        if (lines.length < 2) throw new Error("CSV is empty or has only a header."); 
        
        const header = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/_/g, '')); 
        
        const findIndex = (possibleNames) => { 
            for (const name of possibleNames) { 
                const index = header.indexOf(name.replace(/_/g, '')); 
                if (index !== -1) return index; 
            } 
            return -1; 
        }; 
        
        const schemaIndex = findIndex(['schema', 'tableschema']); 
        const tableIndex = findIndex(['table', 'tablename']); 
        const columnIndex = findIndex(['column', 'columnname']); 
        
        if (schemaIndex === -1 || tableIndex === -1 || columnIndex === -1) { 
            throw new Error("CSV headers must contain variations of 'schema', 'table', and 'column'."); 
        } 
        
        const data = {}; 
        for (let i = 1; i < lines.length; i++) { 
            const values = lines[i].split(','); 
            const schemaName = values[schemaIndex]?.trim(); 
            const tableName = values[tableIndex]?.trim(); 
            const columnName = values[columnIndex]?.trim(); 
            
            if (!schemaName || !tableName || !columnName) continue; 
            
            if (!data[schemaName]) data[schemaName] = {}; 
            if (!data[schemaName][tableName]) data[schemaName][tableName] = []; 
            if (!data[schemaName][tableName].includes(columnName)) { 
                data[schemaName][tableName].push(columnName); 
            } 
        } 
        return data; 
    }
};
