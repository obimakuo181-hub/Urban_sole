
    document.addEventListener('DOMContentLoaded', () => {

      const revealElements = document.querySelectorAll(
        '.about-content, .about-image-wrapper'
      );


      const observer = new IntersectionObserver(
        (entries) => {

          entries.forEach(entry => {

            if (entry.isIntersecting) {

              entry.target.classList.add('active');

              observer.unobserve(entry.target);

            }

          });

        },
        {
          root: null,
          rootMargin: '0px',
          threshold: 0.15
        }
      );


      revealElements.forEach(element => {

        observer.observe(element);

      });

    });
