import { Image, makeStyles, shorthands, tokens } from '@fluentui/react-components';
import '../../index.css';

import gavinLogo from '../../assets/gavin-logo.png';
import gavinTypeLogo from '../../assets/gavin-type-logo.png';

const useClasses = makeStyles({
    root: {
        display: 'flex',
        flexDirection: 'row',
        marginRight: 'auto',
        marginTop: 'auto',
        marginBottom: 'auto',
        marginLeft: '40px',
        height: '30%',
        ...shorthands.gap(tokens.spacingHorizontalL),
    },
});

export const LogoSection = () => {
    const classes = useClasses();

    return (
        <div className={classes.root}>
            <Image src={gavinTypeLogo} />
            <Image src={gavinLogo} />
        </div>
    );
};
