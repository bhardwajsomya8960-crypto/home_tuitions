const ACTOR = 'admin'

// Invoices and manual payments.
function createBillingController({ services }) {
  const { billing } = services
  return {
    list: req => billing.listInvoices(req.query),
    create: async req => billing.invoiceView(await billing.createInvoice(req.body, ACTOR)),
    recordPayment: async req => billing.invoiceView((await billing.recordPayment(req.params.id, req.body, ACTOR)).invoice),
    void: async req => billing.invoiceView(await billing.voidInvoice(req.params.id, ACTOR)),
  }
}

module.exports = { createBillingController }
