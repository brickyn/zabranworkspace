export interface RuleEvaluationResult {
    isMatch: boolean;
    actions: any[];
    matchedRules: string[];
}
export declare class RuleEngineService {
    /**
     * Evaluates business rules for a specific module and category.
     * @param module e.g., 'POS', 'INVENTORY'
     * @param category e.g., 'DISCOUNT', 'APPROVAL'
     * @param inputPayload Data to be evaluated (e.g., { role: 'Cashier', amount: 500000 })
     * @param entityType (Optional) For audit log
     * @param entityId (Optional) For audit log
     * @param triggeredBy (Optional) User ID triggering the evaluation
     */
    evaluate(module: string, category: string, inputPayload: any, entityType?: string, entityId?: string, triggeredBy?: string): Promise<RuleEvaluationResult>;
    /**
     * Evaluates a DSL condition node.
     * Format: { operator: 'AND', rules: [{ field: 'qty', operator: '>', value: 10 }] }
     */
    private evaluateConditionNode;
    private evaluateSimpleRule;
}
export declare const RuleEngine: RuleEngineService;
//# sourceMappingURL=RuleEngine.d.ts.map