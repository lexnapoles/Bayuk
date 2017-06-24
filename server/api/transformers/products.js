export const transformProduct = product => ({
	id:          product.id,
	name:        product.name,
	images:      product.images,
	owner:       product.owner,
	description: product.description,
	category:    product.category,
	createdAt:   product.created_at,
	price:       parseInt(product.price, 10),
	latitude:    parseFloat(product.latitude),
	longitude:   parseFloat(product.longitude),
	sold:        product.sold
});