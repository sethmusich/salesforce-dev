import { LightningElement, api, wire } from 'lwc';
import { gql, graphql } from 'lightning/uiGraphQLApi';

export default class AccountContactsList extends LightningElement {
    @api recordId;

    loading = true;
    error;
    rows = [];
    columns = [
        { label: 'Name', fieldName: 'linkName', type: 'url', typeAttributes: { label: { fieldName: 'Name' }, target: '_blank' } },
        { label: 'Title', fieldName: 'Title' },
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

    // Provide variables getter for the wire adapter
    get variables() {
        return {
            accountId: this.recordId
        };
    }
}
