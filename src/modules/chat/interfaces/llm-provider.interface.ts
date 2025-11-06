export interface ILLMProvider {
    generateResponse(
        query: string,
        context: string,
        onToken?: (token: string) => void
    ): Promise<string>;

    testConnection(): Promise<boolean>;
}