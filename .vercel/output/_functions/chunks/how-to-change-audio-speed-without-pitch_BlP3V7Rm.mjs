import { g as createVNode, F as Fragment, aA as __astro_tag_component__ } from './astro/server_CayxtmO5.mjs';
import 'clsx';

const frontmatter = {
  "title": "Como acelerar ou abrandar o áudio sem alterar o tom",
  "description": "Aprenda a alterar a velocidade de reprodução de um ficheiro de áudio, mantendo a afinação original. Ideal para a edição de podcasts, a aprendizagem de línguas e a prática musical.",
  "date": "2025-04-10T00:00:00.000Z",
  "author": "Equipa Dayront",
  "categories": ["Tutoriais", "Edição de áudio"],
  "tags": ["regulador de velocidade", "tom", "edição de áudio", "ritmo"],
  "image": "https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=800&q=80",
  "relatedPosts": ["guia-definitivo-sobre-compressão-de-áudio", "10-dicas-essenciais-para-a-edição-de-áudio"]
};
function getHeadings() {
  return [{
    "depth": 1,
    "slug": "como-acelerar-ou-abrandar-o-áudio-sem-alterar-o-tom",
    "text": "Como acelerar ou abrandar o áudio sem alterar o tom"
  }, {
    "depth": 2,
    "slug": "por-que-é-que-o-tom-é-importante",
    "text": "Por que é que o tom é importante"
  }, {
    "depth": 3,
    "slug": "casos-de-utilização-comuns",
    "text": "Casos de utilização comuns"
  }, {
    "depth": 2,
    "slug": "como-funciona-o-speed-changer-simplificado",
    "text": "Como funciona o Speed Changer (simplificado)"
  }, {
    "depth": 2,
    "slug": "passo-a-passo-alterar-a-velocidade-com-o-dayront",
    "text": "Passo a passo: Alterar a velocidade com o Dayront"
  }, {
    "depth": 2,
    "slug": "antes-e-depois-comparação-de-formas-de-onda",
    "text": "Antes e depois: comparação de formas de onda"
  }, {
    "depth": 2,
    "slug": "limitações-e-dicas",
    "text": "Limitações e dicas"
  }, {
    "depth": 2,
    "slug": "para-além-do-básico-funcionalidades-futuras",
    "text": "Para além do básico: funcionalidades futuras"
  }];
}
function _createMdxContent(props) {
  const _components = {
    a: "a",
    blockquote: "blockquote",
    em: "em",
    h1: "h1",
    h2: "h2",
    h3: "h3",
    li: "li",
    ol: "ol",
    p: "p",
    strong: "strong",
    table: "table",
    tbody: "tbody",
    td: "td",
    th: "th",
    thead: "thead",
    tr: "tr",
    ul: "ul",
    ...props.components
  };
  return createVNode(Fragment, {
    children: [createVNode(_components.h1, {
      id: "como-acelerar-ou-abrandar-o-áudio-sem-alterar-o-tom",
      children: "Como acelerar ou abrandar o áudio sem alterar o tom"
    }), "\n", createVNode(_components.p, {
      children: ["Alguma vez quiseste ouvir uma palestra a uma velocidade de 1,5× sem que as vozes soassem como as de um esquilo? Ou abrandar um solo de guitarra para aprender cada nota sem que soe como um baixo? É isso que a ", createVNode(_components.strong, {
        children: "ajuste de tempo com preservação do tom"
      }), " faz – e o Speed Changer da Dayront torna isso possível instantaneamente, de graça, no teu navegador."]
    }), "\n", createVNode(_components.h2, {
      id: "por-que-é-que-o-tom-é-importante",
      children: "Por que é que o tom é importante"
    }), "\n", createVNode(_components.p, {
      children: "Quando reproduzes o áudio simplesmente mais rápido (como acelerar uma cassete), o tom aumenta. As vozes ficam estridentes e a música fica desafinada. O verdadeiro «time-stretching» altera o tempo, mantendo o tom constante. Isto é feito através de algoritmos avançados de processamento de sinal – e agora pode fazê-lo online sem instalar nada."
    }), "\n", createVNode(_components.h3, {
      id: "casos-de-utilização-comuns",
      children: "Casos de utilização comuns"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Edição de podcasts"
        }), " – condensa segmentos prolixos sem afastar os ouvintes."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Aprendizagem de línguas"
        }), " – abranda a velocidade dos falantes nativos para perceberes cada palavra."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Prática musical"
        }), " – abranda uma passagem rápida para a aprenderes e, depois, acelera-a para te testares."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Acessibilidade"
        }), " – ajuste a velocidade dos audiolivros ao seu nível de conforto."]
      }), "\n"]
    }), "\n", createVNode("img", {
      src: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=800&q=80",
      alt: "Pessoa a usar auscultadores",
      width: "800",
      height: "534",
      class: "rounded-xl my-6",
      loading: "lazy"
    }), "\n", createVNode(_components.h2, {
      id: "como-funciona-o-speed-changer-simplificado",
      children: "Como funciona o Speed Changer (simplificado)"
    }), "\n", createVNode(_components.p, {
      children: ["As alterações tradicionais na velocidade de reprodução alteram a altura do som. A técnica do ", createVNode(_components.strong, {
        children: "vocoder de fase"
      }), ", utilizada pelo FFmpeg e pelo Dayront, processa o áudio em pequenos quadros sobrepostos, ajusta o espaçamento entre eles e, em seguida, ressintetiza o sinal – tudo isto sem afetar a frequência."]
    }), "\n", createVNode(_components.p, {
      children: "Eis uma comparação simples:"
    }), "\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n", createVNode(_components.table, {
      children: [createVNode(_components.thead, {
        children: createVNode(_components.tr, {
          children: [createVNode(_components.th, {
            children: "Fator de velocidade"
          }), createVNode(_components.th, {
            children: "Efeito na altura do som (sem preservação)"
          }), createVNode(_components.th, {
            children: "Dayront (preservada)"
          })]
        })
      }), createVNode(_components.tbody, {
        children: [createVNode(_components.tr, {
          children: [createVNode(_components.td, {
            children: "0,75×"
          }), createVNode(_components.td, {
            children: "Reduz em ~5 semitons"
          }), createVNode(_components.td, {
            children: "Tom inalterado"
          })]
        }), createVNode(_components.tr, {
          children: [createVNode(_components.td, {
            children: "1,25×"
          }), createVNode(_components.td, {
            children: "Aumenta em ~3 semitons"
          }), createVNode(_components.td, {
            children: "Tom inalterado"
          })]
        }), createVNode(_components.tr, {
          children: [createVNode(_components.td, {
            children: "2,0×"
          }), createVNode(_components.td, {
            children: "Aumenta em 12 semitons (oitava)"
          }), createVNode(_components.td, {
            children: "Afinação inalterada"
          })]
        })]
      })]
    }), "\n", createVNode("img", {
      src: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
      alt: "Forma de onda de áudio com etiquetas",
      width: "800",
      height: "450",
      class: "rounded-xl my-6",
      loading: "lazy"
    }), "\n", createVNode(_components.h2, {
      id: "passo-a-passo-alterar-a-velocidade-com-o-dayront",
      children: "Passo a passo: Alterar a velocidade com o Dayront"
    }), "\n", createVNode(_components.ol, {
      children: ["\n", createVNode(_components.li, {
        children: createVNode(_components.strong, {
          children: ["Aceda à ", createVNode(_components.a, {
            href: "/tools/speed-changer",
            children: "ferramenta Speed Changer"
          }), "."]
        })
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Carregue o seu ficheiro de áudio"
        }), " – MP3, WAV, M4A, etc."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Escolha um fator de velocidade"
        }), " (atualmente, o valor predefinido é 1,5×, mas poderá ajustá-lo no futuro ou utilizar as nossas definições avançadas – em breve)."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Clique em «Iniciar»"
        }), " – o ficheiro é processado instantaneamente no seu navegador."]
      }), "\n", createVNode(_components.li, {
        children: [createVNode(_components.strong, {
          children: "Descarregue o áudio com a velocidade ajustada"
        }), " – será reproduzido no novo tempo, mantendo o tom original."]
      }), "\n"]
    }), "\n", createVNode(_components.blockquote, {
      children: ["\n", createVNode(_components.p, {
        children: [createVNode(_components.strong, {
          children: "Dica:"
        }), " No caso de ficheiros muito grandes, o processamento pode demorar alguns segundos. Mas, como tudo é feito localmente, não perde tempo a fazer o upload."]
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "antes-e-depois-comparação-de-formas-de-onda",
      children: "Antes e depois: comparação de formas de onda"
    }), "\n", createVNode("img", {
      src: "https://images.unsplash.com/photo-1633617477270-7a8ff6f4d5f2?w=800&q=80",
      alt: "Duas formas de onda lado a lado",
      width: "800",
      height: "450",
      class: "rounded-xl my-6",
      loading: "lazy"
    }), "\n", createVNode(_components.p, {
      children: createVNode(_components.em, {
        children: "(Pode substituir isto por uma imagem real das formas de onda antes e depois)"
      })
    }), "\n", createVNode(_components.p, {
      children: "Depois de abrandar um clip de 10 segundos para 75% da velocidade, a forma de onda estica-se horizontalmente, mas mantém as suas características verticais (amplitude). Quando reproduzida, a altura do som é idêntica à do original – apenas mais lenta."
    }), "\n", createVNode(_components.h2, {
      id: "limitações-e-dicas",
      children: "Limitações e dicas"
    }), "\n", createVNode(_components.ul, {
      children: ["\n", createVNode(_components.li, {
        children: "Configurações extremas (abaixo de 0,5× ou acima de 2,0×) podem introduzir artefactos. Para obter a melhor qualidade, mantenha-se entre 0,75× e 1,5×."
      }), "\n", createVNode(_components.li, {
        children: "Ficheiros com transientes fortes (como bateria) podem soar ligeiramente distorcidos quando abrandados."
      }), "\n", createVNode(_components.li, {
        children: "Guarde sempre uma cópia do seu ficheiro original antes de fazer experiências."
      }), "\n"]
    }), "\n", createVNode(_components.h2, {
      id: "para-além-do-básico-funcionalidades-futuras",
      children: "Para além do básico: funcionalidades futuras"
    }), "\n", createVNode(_components.p, {
      children: ["Estamos a planear adicionar uma ", createVNode(_components.strong, {
        children: "pré-visualização em tempo real"
      }), " e um ", createVNode(_components.strong, {
        children: "regulador avançado"
      }), " para que possa escolher a percentagem exata de velocidade. Além disso, está em desenvolvimento a alteração independente da altura do som (sem alterar o tempo)."]
    }), "\n", createVNode(_components.p, {
      children: ["Por enquanto, aproveite a liberdade de alterar a velocidade de reprodução sem prejudicar o som. Experimente já o ", createVNode(_components.a, {
        href: "/tools/speed-changer",
        children: "Speed Changer"
      }), " – é gratuito e confidencial."]
    })]
  });
}
function MDXContent(props = {}) {
  const {wrapper: MDXLayout} = props.components || ({});
  return MDXLayout ? createVNode(MDXLayout, {
    ...props,
    children: createVNode(_createMdxContent, {
      ...props
    })
  }) : _createMdxContent(props);
}

const url = "src/content/blog/pt/how-to-change-audio-speed-without-pitch.mdx";
const file = "/home/dayront/src/content/blog/pt/how-to-change-audio-speed-without-pitch.mdx";
const Content = (props = {}) => MDXContent({
  ...props,
  components: { Fragment: Fragment, ...props.components, },
});
Content[Symbol.for('mdx-component')] = true;
Content[Symbol.for('astro.needsHeadRendering')] = !Boolean(frontmatter.layout);
Content.moduleId = "/home/dayront/src/content/blog/pt/how-to-change-audio-speed-without-pitch.mdx";
__astro_tag_component__(Content, 'astro:jsx');

export { Content, Content as default, file, frontmatter, getHeadings, url };
