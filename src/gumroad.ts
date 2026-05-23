import axios from 'axios';
import { GUMROAD_ACCESS_TOKEN } from './config';

const BASE_URL = 'https://api.gumroad.com/v2';

export interface GumroadProductResponse {
  id: string;
  name: string;
  price: number;
  description: string;
  short_url: string;
  published: boolean;
}

export async function createProduct(name: string, priceInCents: number, description: string): Promise<GumroadProductResponse> {
  if (!GUMROAD_ACCESS_TOKEN) {
    throw new Error('GUMROAD_ACCESS_TOKEN is not defined in environment variables.');
  }

  console.log(`Gumroad API: Creating product "${name}" (Price: $${(priceInCents / 100).toFixed(2)})...`);

  try {
    const response = await axios.post(
      `${BASE_URL}/products`,
      {
        name,
        price: priceInCents,
        description
      },
      {
        headers: {
          'Authorization': `Bearer ${GUMROAD_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const product = response.data?.product;
    if (!product || !product.id) {
      throw new Error(`Gumroad API returned success but product object was missing or invalid: ${JSON.stringify(response.data)}`);
    }

    console.log(`Gumroad API: Product created successfully as Draft! ID: ${product.id}`);
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description,
      short_url: product.short_url,
      published: product.published || false
    };
  } catch (error: any) {
    console.error('Gumroad API Error creating product:', error.response?.data || error.message);
    throw new Error(`Gumroad API Error: ${error.response?.data?.message || error.message}`);
  }
}

export async function publishProduct(productId: string): Promise<boolean> {
  if (!GUMROAD_ACCESS_TOKEN) {
    throw new Error('GUMROAD_ACCESS_TOKEN is not defined in environment variables.');
  }

  console.log(`Gumroad API: Publishing product with ID: ${productId}...`);

  try {
    const response = await axios.put(
      `${BASE_URL}/products/${productId}/enable`,
      {},
      {
        headers: {
          'Authorization': `Bearer ${GUMROAD_ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data?.success || response.status === 200) {
      console.log(`Gumroad API: Product ${productId} is now LIVE!`);
      return true;
    } else {
      console.warn(`Gumroad API: Enable completed but response did not indicate success: ${JSON.stringify(response.data)}`);
      return false;
    }
  } catch (error: any) {
    console.error(`Gumroad API Error publishing product ${productId}:`, error.response?.data || error.message);
    // If the PUT endpoint fails, write a helpful warning but don't crash the whole pipeline, 
    // as the product was already created and can be published manually
    return false;
  }
}
