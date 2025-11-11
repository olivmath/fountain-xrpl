import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';

import HomepageFeatures from '@site/src/components/HomepageFeatures';

import styles from './index.module.css';

function HomepageHeader(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.hero)}>
      <div className={styles.heroGlow} />
      <div className="container">
        <div className={styles.heroContent}>
          <span className={styles.eyebrow}>Documentação Fountain</span>
          <Heading as="h1" className={styles.title}>
          Stablecoin Factory para RWA  com {siteConfig.title}
          </Heading>
          <p className={styles.subtitle}>
            Dashboards, APIs e fluxos de compliance para tokenizadoras emitirem e gerenciarem stablecoins BRL no XRP
            Ledger com governança empresarial.
          </p>
          <div className={styles.actions}>
            <Link className={clsx('button button--lg', styles.primaryAction)} to="/docs/intro">
              Começar agora
            </Link>
            <Link
              className={clsx('button button--secondary button--lg', styles.secondaryAction)}
              href="https://github.com/olivmath/fountain-xrpl/tree/main/sdks">
              Ver SDK no GitHub
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout title={siteConfig.title} description={siteConfig.tagline}>
      <HomepageHeader />
      <main className={styles.main}>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
