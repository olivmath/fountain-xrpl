import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';

import styles from './styles.module.css';

type FeatureItem = {
  eyebrow: string;
  title: string;
  description: ReactNode;
  href: string;
  cta: string;
};

const FeatureList: FeatureItem[] = [
  {
    eyebrow: 'APIs e Webhooks',
    title: 'Infraestrutura de emissão',
    description: (
      <>
        Crie, queime e reconcilie stablecoins BRL com endpoints idempotentes, webhooks assinados e SDKs otimizados para
        produção.
      </>
    ),
    href: '/docs/intro',
    cta: 'Ver guia de integração',
  },
  {
    eyebrow: 'XRPL Enterprise',
    title: 'Conectado à blockchain da Ripple',
    description: (
      <>
        Utilize a XRPL para mint, burn e distribuição audível de stablecoins, transações rápidas e integração nativa com ecossistema cripto global.
      </>
    ),
    href: '/docs/api/infraestrutura#xrpl-service-srcxrplxrplservicets',
    cta: 'Saber mais sobre XRPL',
  },
  {
    eyebrow: 'Observabilidade',
    title: 'Operações em tempo real',
    description: (
      <>
        Dashboards com prova de reservas, relatórios contábeis e auditoria contínua para acompanhar emissão, liquidez e
        reconciliações.
      </>
    ),
    href: '/docs/tutorial-extras/manage-docs-versions',
    cta: 'Abrir dashboards',
  },
];

function FeatureCard({eyebrow, title, description, href, cta}: FeatureItem): ReactNode {
  return (
    <div className={styles.card}>
      <span className={styles.cardEyebrow}>{eyebrow}</span>
      <Heading as="h3" className={styles.cardTitle}>
        {title}
      </Heading>
      <p className={styles.cardDescription}>{description}</p>
      <Link className={styles.cardCta} to={href}>
        <span>{cta}</span>
        <span aria-hidden className={styles.cardCtaIcon}>
          →
        </span>
      </Link>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className={clsx('container', styles.featuresContainer)}>
        <div className={styles.featuresHeader}>
          <span className={styles.featuresBadge}>Por que escolher a Fountain</span>
          <Heading as="h2" className={styles.featuresTitle}>
            Os blocos para lançar uma operação de stablecoin regulada
          </Heading>
          <p className={styles.featuresSubtitle}>
            Documentação completa para equipes de produto, engenharia e compliance reconstruírem sua tesouraria em
            minutos.
          </p>
        </div>
        <div className={styles.grid}>
          {FeatureList.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>
      </div>
    </section>
  );
}
