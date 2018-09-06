declare module 'node-adodb' {
    const open: (connection: string) => open;

    export interface open {
        execute(sql: string, scalar?: string): Execute;
        executeWithTransaction(sql: string, scalar?: string): Execute;
        bulkExecuteWithTransaction(sql: string): Execute;
        query(sql: string): Query;
        queryWithTransaction(sql: string): Query;
    }

    class Execute {
        on(event: 'done', fn: (data: Array<any>, message: string) => void, context?: any): Execute;
        on(event: 'fail', fn: (error: string) => void, context?: any): Execute;
        off(event: 'done', fn?: (data: Array<any>, message: string) => void, context?: any): Execute;
        off(event: 'fail', fn?: (error: string) => void, context?: any): Execute;
        once(event: 'done', fn?: (data: Array<any>, message: string) => void, context?: any): Execute;
        once(event: 'fail', fn?: (error: string) => void, context?: any): Execute;
    }

    class Query {
        on(event: 'done', fn: (data: Array<any>, message: string) => void, context?: any): Query;
        on(event: 'fail', fn: (error: string) => void, context?: any): Query;
        off(event: 'done', fn?: (data: Array<any>, message: string) => void, context?: any): Query;
        off(event: 'fail', fn?: (error: string) => void, context?: any): Query;
        once(event: 'done', fn?: (data: Array<any>, message: string) => void, context?: any): Query;
        once(event: 'fail', fn?: (error: string) => void, context?: any): Query;
    }
}
