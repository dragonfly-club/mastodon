import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { FormattedMessage } from 'react-intl';

import classNames from 'classnames';

import { is } from 'immutable';
import ImmutablePropTypes from 'react-immutable-proptypes';

import { debounce } from 'lodash';

import { AltTextBadge } from 'mastodon/components/alt_text_badge';
import { Blurhash } from 'mastodon/components/blurhash';
import { SpoilerButton } from 'mastodon/components/spoiler_button';
import { formatTime } from 'mastodon/features/video';

import { autoPlayGif, displayMedia, useBlurhash } from '../initial_state';

class Item extends PureComponent {

  static propTypes = {
    attachment: ImmutablePropTypes.map.isRequired,
    lang: PropTypes.string,
    standalone: PropTypes.bool,
    index: PropTypes.number.isRequired,
    size: PropTypes.number.isRequired,
    onClick: PropTypes.func.isRequired,
    displayWidth: PropTypes.number,
    visible: PropTypes.bool.isRequired,
    autoplay: PropTypes.bool,
  };

  static defaultProps = {
    standalone: false,
    index: 0,
    size: 1,
  };

  state = {
    loaded: false,
    error: false,
  };

  handleMouseEnter = (e) => {
    if (this.hoverToPlay()) {
      e.target.play();
    }
  };

  handleMouseLeave = (e) => {
    if (this.hoverToPlay()) {
      e.target.pause();
      e.target.currentTime = 0;
    }
  };

  getAutoPlay() {
    return this.props.autoplay || autoPlayGif;
  }

  hoverToPlay () {
    const { attachment } = this.props;
    return !this.getAutoPlay() && ['gifv', 'video'].includes(attachment.get('type'));
  }

  handleClick = (e) => {
    const { index, onClick } = this.props;

    if (e.button === 0 && !(e.ctrlKey || e.metaKey)) {
      if (this.hoverToPlay()) {
        e.target.pause();
        e.target.currentTime = 0;
      }
      e.preventDefault();
      onClick(index);
    }

    e.stopPropagation();
  };

  handleImageLoad = () => {
    this.setState({ loaded: true });
  };

  handleImageError = () => {
    this.setState({ error: true });
  };

  render () {
    const { attachment, lang, index, size, standalone, displayWidth, visible } = this.props;

    let badges = [], thumbnail;

    let width  = 50;
    let height = 50;

    let spans = 1;

    if (size === 1) {
      width = 100;
      height = 100;
      spans = 2;
    }

    if (size === 2) {
      height = 100;
    }

    if (size === 3 && index === 0) {
      height = 100;
    }

    if (size === 5 && index === 3) {
      spans = 2;
    }

    if (size === 7 && index === 6) {
      spans = 3;
    }

    if (size === 8 && index === 6) {
      spans = 2;
    }

    const description = attachment.getIn(['translation', 'description']) || attachment.get('description');

    if (description?.length > 0) {
      badges.push(<AltTextBadge key='alt' description={description} />);
    }

    if (attachment.get('type') === 'unknown') {
      return (
        <div className={classNames('media-gallery__item', { standalone, 'media-gallery__item--tall': height === 100, 'media-gallery__item--wide': width === 100 })} key={attachment.get('id')} style={{ gridColumn: `span ${spans}` }}>
          <a className='media-gallery__item-thumbnail' href={attachment.get('remote_url') || attachment.get('url')} style={{ cursor: 'pointer' }} title={description} lang={lang} target='_blank' rel='noopener'>
            <Blurhash
              hash={attachment.get('blurhash')}
              className='media-gallery__preview'
              dummy={!useBlurhash}
            />
          </a>
        </div>
      );
    } else if (attachment.get('type') === 'image') {
      const previewUrl   = attachment.get('preview_url');
      const previewWidth = attachment.getIn(['meta', 'small', 'width']);

      const originalUrl   = attachment.get('url');
      const originalWidth = attachment.getIn(['meta', 'original', 'width']);

      const hasSize = typeof originalWidth === 'number' && typeof previewWidth === 'number';

      const srcSet = hasSize ? `${originalUrl} ${originalWidth}w, ${previewUrl} ${previewWidth}w` : null;
      const sizes  = hasSize && (displayWidth > 0) ? `${displayWidth * (width / 100)}px` : null;

      const focusX = attachment.getIn(['meta', 'focus', 'x']) || 0;
      const focusY = attachment.getIn(['meta', 'focus', 'y']) || 0;
      const x      = ((focusX /  2) + .5) * 100;
      const y      = ((focusY / -2) + .5) * 100;

      thumbnail = (
        <a
          className='media-gallery__item-thumbnail'
          href={attachment.get('remote_url') || originalUrl}
          onClick={this.handleClick}
          target='_blank'
          rel='noopener'
          style={{ gridColumn: `span ${spans}` }}
        >
          <img
            src={previewUrl}
            srcSet={srcSet}
            sizes={sizes}
            alt={description}
            lang={lang}
            style={{ objectPosition: `${x}% ${y}%` }}
            onLoad={this.handleImageLoad}
            onError={this.handleImageError}
          />
        </a>
      );
    } else if (['gifv', 'video'].includes(attachment.get('type'))) {
      const autoPlay = this.getAutoPlay();
      const duration = attachment.getIn(['meta', 'original', 'duration']);

      if (attachment.get('type') === 'gifv') {
        badges.push(<span key='gif' className='media-gallery__alt__label media-gallery__alt__label--non-interactive'>GIF</span>);
      } else {
        badges.push(<span key='video' className='media-gallery__alt__label media-gallery__alt__label--non-interactive'>{formatTime(Math.floor(duration))}</span>);
      }

      thumbnail = (
        <div className={classNames('media-gallery__gifv', { autoplay: autoPlay })} style={{ gridColumn: `span ${spans}` }}>
          <video
            className='media-gallery__item-gifv-thumbnail'
            aria-label={description}
            lang={lang}
            role='application'
            src={attachment.get('url')}
            onClick={this.handleClick}
            onMouseEnter={this.handleMouseEnter}
            onMouseLeave={this.handleMouseLeave}
            onLoadedData={this.handleImageLoad}
            autoPlay={autoPlay}
            playsInline
            loop
            muted
          />
        </div>
      );
    }

    return (
      <div className={classNames('media-gallery__item', { standalone, 'media-gallery__item--error': this.state.error, 'media-gallery__item--tall': height === 100, 'media-gallery__item--wide': width === 100 })} key={attachment.get('id')}>
        <Blurhash
          hash={attachment.get('blurhash')}
          dummy={!useBlurhash}
          className={classNames('media-gallery__preview', {
            'media-gallery__preview--hidden': visible && this.state.loaded,
          })}
        />

        {visible && thumbnail}

        {visible && badges && (
          <div className='media-gallery__item__badges'>
            {badges}
          </div>
        )}
      </div>
    );
  }

}

class MediaGallery extends PureComponent {

  static propTypes = {
    sensitive: PropTypes.bool,
    media: ImmutablePropTypes.list.isRequired,
    lang: PropTypes.string,
    size: PropTypes.object,
    height: PropTypes.number.isRequired,
    onOpenMedia: PropTypes.func.isRequired,
    defaultWidth: PropTypes.number,
    cacheWidth: PropTypes.func,
    visible: PropTypes.bool,
    autoplay: PropTypes.bool,
    onToggleVisibility: PropTypes.func,
    matchedFilters: PropTypes.arrayOf(PropTypes.string),
  };

  state = {
    visible: this.props.visible !== undefined ? this.props.visible : (displayMedia !== 'hide_all' && !this.props.sensitive || displayMedia === 'show_all'),
    width: this.props.defaultWidth,
  };

  componentDidMount () {
    window.addEventListener('resize', this.handleResize, { passive: true });
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.handleResize);
  }

  UNSAFE_componentWillReceiveProps (nextProps) {
    if (!is(nextProps.media, this.props.media) && nextProps.visible === undefined) {
      this.setState({ visible: displayMedia !== 'hide_all' && !nextProps.sensitive || displayMedia === 'show_all' });
    } else if (!is(nextProps.visible, this.props.visible) && nextProps.visible !== undefined) {
      this.setState({ visible: nextProps.visible });
    }
  }

  handleResize = debounce(() => {
    if (this.node) {
      this._setDimensions();
    }
  }, 250, {
    trailing: true,
  });

  handleOpen = () => {
    if (this.props.onToggleVisibility) {
      this.props.onToggleVisibility();
    } else {
      this.setState({ visible: !this.state.visible });
    }
  };

  handleClick = (index) => {
    this.props.onOpenMedia(this.props.media, index, this.props.lang);
  };

  handleRef = c => {
    this.node = c;

    if (this.node) {
      this._setDimensions();
    }
  };

  _setDimensions () {
    const width = this.node.offsetWidth;

    // offsetWidth triggers a layout, so only calculate when we need to
    if (this.props.cacheWidth) {
      this.props.cacheWidth(width);
    }

    this.setState({
      width: width,
    });
  }

  isFullSizeEligible() {
    const { media } = this.props;
    return media.size === 1 && media.getIn([0, 'meta', 'small', 'aspect']);
  }

  render () {
    const { media, lang, sensitive, defaultWidth, autoplay, matchedFilters } = this.props;
    const { visible } = this.state;
    const width = this.state.width || defaultWidth;

    let children;

    const style = {};

    if (this.isFullSizeEligible()) {
      style.aspectRatio = `${this.props.media.getIn([0, 'meta', 'small', 'aspect'])}`;
    } else {
      style.aspectRatio = '3 / 2';
    }

    style.gridTemplateColumns = this.props.media.size < 5 ? '50% 50%' : '33.3% 33.3% 33.3%';
    style.gridTemplateRows = this.props.media.size < 7 ? '50% 50%' : '33.3% 33.3% 33.3%';

    const size     = media.size;
    const uncached = media.every(attachment => attachment.get('type') === 'unknown');

    if (this.isFullSizeEligible()) {
      children = <Item standalone autoplay={autoplay} onClick={this.handleClick} attachment={media.get(0)} lang={lang} displayWidth={width} visible={visible} />;
    } else {
      children = media.map((attachment, i) => <Item key={attachment.get('id')} autoplay={autoplay} onClick={this.handleClick} attachment={attachment} index={i} lang={lang} size={size} displayWidth={width} visible={visible || uncached} />);
    }

    return (
      <div className={`media-gallery media-gallery--layout-${size}`} style={style} ref={this.handleRef}>
        {children}

        {(!visible || uncached) && <SpoilerButton uncached={uncached} sensitive={sensitive} onClick={this.handleOpen} matchedFilters={matchedFilters} />}

        {(visible && !uncached) && (
          <div className='media-gallery__actions'>
            <button className='media-gallery__actions__pill' onClick={this.handleOpen}><FormattedMessage id='media_gallery.hide' defaultMessage='Hide' /></button>
          </div>
        )}
      </div>
    );
  }

}

export default MediaGallery;
