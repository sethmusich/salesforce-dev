import { LightningElement, api, wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';
import { updateRecord } from 'lightning/uiRecordApi';
import TITLE_FIELD from '@salesforce/schema/Contact.Title';
import ID_FIELD from '@salesforce/schema/Contact.Id';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class AccountContactsList extends LightningElement {
    @api recordId;

    loading = true;
    error;
    rows = [];
    draftValues = [];
    columns = [
        { label: 'Name', fieldName: 'linkName', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
        { label: 'Title', fieldName: 'Title', editable: true },
        { label: 'Phone', fieldName: 'Phone' },
        { label: 'Email', fieldName: 'Email', type: 'email' }
    ];

    get noData() {
        return !this.loading && !this.error && this.rows.length === 0;
    }

    get errorMessage() {
        if (!this.error) return '';
        // GraphQL wire provides a rich error; prefer a user-friendly message
        return (this.error.body && this.error.body.message) ? this.error.body.message : 'An error occurred while loading contacts.';
    }

    @wire(graphql, {
        query: gql`
            query AccountContacts($accountId: ID!) {
                uiapi {
                    query {
                        Contact(
                            where: { AccountId: { eq: $accountId } }
                            orderBy: { LastName: { order: ASC } }
                        ) {
                            edges {
                                node {
                                    Id
                                    Name {
                                        value
                                    }
                                    Title {
                                        value
                                    }
                                    Phone {
                                        value
                                    }
                                    Email {
                                        value
                                    }
                                    AccountId {
                                        value
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `,
        variables: '$variables'
    })
    wiredContacts({ data, error }) {
        if (data) {
            const edges = data.uiapi.query.Contact.edges || [];
            this.rows = edges.map(e => {
                const node = e.node;
                const id = node.Id;
                const name = node.Name?.value || '';
                const title = node.Title?.value || '';
                const phone = node.Phone?.value || '';
                const email = node.Email?.value || '';
                return {
                    Id: id,
                    Name: name,
                    Title: title,
                    Phone: phone,
                    Email: email,
                    linkName: '/' + id
                };
            });
            this.error = undefined;
            this.loading = false;
        } else if (error) {
            this.error = error;
            this.rows = [];
            this.loading = false;
        }
    }

    async handleSave(event) {
        const drafts = event.detail.draftValues || [];
        if (!drafts.length) {
            return;
        }
        // Only Title is editable; build update requests
        const updates = drafts.map(d => ({
            fields: {
                [ID_FIELD.fieldApiName]: d.Id,
                [TITLE_FIELD.fieldApiName]: d.Title
            }
        }));

        try {
            this.loading = true;
            await Promise.all(updates.map(u => updateRecord(u)));
            // Merge updated titles into local rows for optimistic UI
            const titleById = new Map(drafts.map(d => [d.Id, d.Title]));
            this.rows = this.rows.map(r => titleById.has(r.Id) ? { ...r, Title: titleById.get(r.Id) } : r);

            // Clear draft values in datatable and tracked state
            this.draftValues = [];
            const table = this.template.querySelector('lightning-datatable');
            if (table) {
                table.draftValues = [];
            }

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Contact title updated',
                    variant: 'success'
                })
            );
            this.error = undefined;
        } catch (e) {
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error updating title',
                    message: (e && e.body && e.body.message) ? e.body.message : 'An error occurred while saving.',
                    variant: 'error'
                })
            );
        } finally {
            this.loading = false;
        }
    }

    // Provide variables getter for the wire adapter
    get variables() {
        return {
            accountId: this.recordId
        };
    }
}
