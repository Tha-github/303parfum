/**
 * Preenche um <picture> de template (1 <source> AVIF + <img>) com a imagem
 * já resolvida de um produto normalizado. Usado pelo card e pelo modal.
 */
export function fillPicture(picture, product, sizes) {
  const source = picture.querySelector('source');
  const img = picture.querySelector('img');
  const { src, webpSrcset, avifSrcset } = product.imagem;

  if (source) {
    if (avifSrcset) {
      source.srcset = avifSrcset;
      source.sizes = sizes;
    } else {
      source.remove();
    }
  }

  img.src = src;
  if (webpSrcset) {
    img.srcset = webpSrcset;
    img.sizes = sizes;
  } else {
    img.removeAttribute('srcset');
    img.removeAttribute('sizes');
  }
  img.alt = product.imagem_alt;
}
