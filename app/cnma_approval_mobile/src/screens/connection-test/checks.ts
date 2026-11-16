/** BFF calls exercised by the connection test, in the order they are run. */
export interface ConnectionCheck {
    id: string;
    title: string;
    description: string;
    path: string;
}

export const CONNECTION_CHECKS: readonly ConnectionCheck[] = [
    { id: 'identity', title: 'BFF identity', description: 'GET /tasks/me — who the BFF thinks you are (read from the Entra token).', path: '/tasks/me' },
    { id: 'sap-user', title: 'SAP session user', description: 'GET /tasks/me/sap-user — the user SAP runs the request as.', path: '/tasks/me/sap-user' },
    { id: 'worklist', title: 'Worklist (top 5)', description: 'GET /tasks?top=5 — task list loaded from SAP.', path: '/tasks?top=5' },
];
